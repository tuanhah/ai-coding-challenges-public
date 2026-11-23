"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  parseEventLogs,
  type Hash,
} from "viem";
import { useConnection, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { miniPositionNftAbi } from "@mini-hook-platform/mini-contracts-mock/abi";
import { getPositionState, type PositionOwnership, type PositionState } from "../../lib/api";
import { appChain, positionNftAddress } from "../../lib/chain";

export function PositionCard({ position, onChanged }: { position: PositionOwnership; onChanged: () => void }) {
  const stateQuery = useQuery({
    queryKey: ["position-state", position.tokenId],
    queryFn: () => getPositionState(position.tokenId),
  });
  const result = stateQuery.data;

  return (
    <li data-testid={`position-${position.tokenId}`} style={card}>
      <div>
        Token #{position.tokenId} — pool {position.poolId}
      </div>
      <div style={muted}>
        last transfer: block {position.lastBlockNumber}, tx {position.lastTxHash}
      </div>

      {stateQuery.isPending && <div style={{ marginTop: 8 }}>Loading live state…</div>}
      {result && !result.ok && (
        <div style={{ marginTop: 8, ...errorText }} data-testid="state-error">
          {result.status === 404 ? "Not found on chain (burned or never minted)." : `Live state unavailable: ${result.error}`}
        </div>
      )}
      {result?.ok && (
        <>
          <LiveState state={result.state} />
          <WithdrawControls
            state={result.state}
            onDone={async () => {
              await stateQuery.refetch();
              onChanged();
            }}
          />
        </>
      )}
    </li>
  );
}

function LiveState({ state }: { state: PositionState }) {
  return (
    <dl style={grid} data-testid="live-state">
      <dt>Range (ticks)</dt>
      <dd data-testid="range">
        [{state.tickLower}, {state.tickUpper})
      </dd>
      <dt>Status</dt>
      <dd>
        <span data-testid="in-range" style={{ ...badge, background: state.inRange ? "#1e4620" : "#5c2b29" }}>
          {state.inRange ? "In range" : "Out of range"}
        </span>
        <span style={muted}> (current tick fixed at {state.currentTick})</span>
      </dd>
      <dt>Liquidity</dt>
      <dd data-testid="liquidity">{state.liquidity}</dd>
      <dt>Uncollected fees</dt>
      <dd data-testid="fees">
        {state.uncollectedFees.token0} token0 / {state.uncollectedFees.token1} token1
      </dd>
      <dt>Owner (on chain)</dt>
      <dd style={{ fontSize: 12 }}>{state.owner}</dd>
      <dt>As of block</dt>
      <dd style={{ fontSize: 12 }}>{state.blockNumber}</dd>
    </dl>
  );
}

type Action = "decrease" | "withdraw-all" | "collect" | "burn";

/**
 * "Decrease liquidity / Withdraw". Every action is a transaction the user's
 * wallet signs and sends directly to MiniPositionNFT from the browser
 * (simulate -> wallet -> receipt). No backend route is involved; the backend
 * is only re-read afterwards to show the new state.
 */
function WithdrawControls({ state, onDone }: { state: PositionState; onDone: () => Promise<void> }) {
  const { address, chainId, isConnected } = useConnection();
  const publicClient = usePublicClient({ chainId: appChain.id });
  const writeContract = useWriteContract();
  const switchChain = useSwitchChain();
  const [amount, setAmount] = useState(state.liquidity);
  // Re-sync the input with the live liquidity after each transaction.
  useEffect(() => setAmount(state.liquidity), [state.liquidity]);
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const liquidity = BigInt(state.liquidity);
  const hasFees = state.uncollectedFees.token0 !== "0" || state.uncollectedFees.token1 !== "0";
  const isOwner = !!address && address.toLowerCase() === state.owner.toLowerCase();
  const wrongContract = positionNftAddress && positionNftAddress.toLowerCase() !== state.contractAddress.toLowerCase();

  const blocker = !positionNftAddress
    ? "NEXT_PUBLIC_POSITION_NFT_ADDRESS is not configured."
    : wrongContract
      ? `Backend reads ${state.contractAddress}, frontend is configured for ${positionNftAddress}.`
      : state.chainId !== appChain.id
        ? `Backend reads chain ${state.chainId}, frontend is configured for chain ${appChain.id}.`
        : !isConnected
          ? "Connect your wallet to withdraw."
          : !isOwner
            ? "The connected wallet is not this position's on-chain owner."
            : null;

  const parsedAmount = /^\d+$/.test(amount) ? BigInt(amount) : null;
  const amountError =
    parsedAmount === null ? "Enter a whole number." : parsedAmount === 0n ? "Must be > 0." : parsedAmount > liquidity ? "Exceeds liquidity." : null;

  async function send(fn: "decreaseLiquidity" | "collect" | "burn", args: readonly [bigint] | readonly [bigint, bigint]) {
    if (!publicClient || !address || !positionNftAddress) throw new Error("wallet not ready");
    if (chainId !== appChain.id) await switchChain.mutateAsync({ chainId: appChain.id });
    // Simulate first: surfaces NotOwner / InsufficientLiquidity before the wallet prompt.
    const { request } = await publicClient.simulateContract({
      account: address,
      address: positionNftAddress,
      abi: miniPositionNftAbi,
      functionName: fn,
      args,
    } as Parameters<typeof publicClient.simulateContract>[0]);
    const hash: Hash = await writeContract.mutateAsync(request as Parameters<typeof writeContract.mutateAsync>[0]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`transaction ${hash} reverted`);
    return receipt;
  }

  async function run(action: Action) {
    setBusy(action);
    setMessage(null);
    const tokenId = BigInt(state.tokenId);
    try {
      if (action === "decrease") {
        await send("decreaseLiquidity", [tokenId, parsedAmount!]);
        setMessage({ kind: "ok", text: `Removed ${parsedAmount} liquidity.` });
      } else if (action === "withdraw-all") {
        // decreaseLiquidity accrues fees, so collect afterwards; burn stays a
        // separate, explicit step (it destroys the NFT).
        if (liquidity > 0n) await send("decreaseLiquidity", [tokenId, liquidity]);
        const receipt = await send("collect", [tokenId]);
        setMessage({ kind: "ok", text: `Withdrew all liquidity; ${describeCollect(receipt.logs)}` });
      } else if (action === "collect") {
        const receipt = await send("collect", [tokenId]);
        setMessage({ kind: "ok", text: describeCollect(receipt.logs) });
      } else {
        await send("burn", [tokenId]);
        setMessage({ kind: "ok", text: "Position burned." });
      }
    } catch (err) {
      setMessage({ kind: "error", text: describeError(err) });
    } finally {
      setBusy(null);
      await onDone();
    }
  }

  const disabled = !!blocker || busy !== null;
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #333", paddingTop: 12 }} data-testid="withdraw-controls">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Decrease liquidity / Withdraw</div>
      {blocker && (
        <div style={{ ...muted, marginBottom: 8 }} data-testid="withdraw-blocker">
          {blocker}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          data-testid="amount"
          value={amount}
          inputMode="numeric"
          onChange={(e) => setAmount(e.target.value.trim())}
          style={{ width: 160 }}
          disabled={disabled || liquidity === 0n}
          aria-label="Liquidity to remove"
        />
        <button data-testid="decrease" disabled={disabled || liquidity === 0n || !!amountError} onClick={() => run("decrease")}>
          {busy === "decrease" ? "Confirm in wallet…" : "Decrease liquidity"}
        </button>
        <button data-testid="withdraw-all" disabled={disabled || (liquidity === 0n && !hasFees)} onClick={() => run("withdraw-all")}>
          {busy === "withdraw-all" ? "Withdrawing…" : "Withdraw all + collect"}
        </button>
        <button data-testid="collect" disabled={disabled || !hasFees} onClick={() => run("collect")}>
          {busy === "collect" ? "Collecting…" : "Collect fees"}
        </button>
        <button
          data-testid="burn"
          disabled={disabled || liquidity !== 0n || hasFees}
          title="Only possible once liquidity and uncollected fees are both 0"
          onClick={() => run("burn")}
        >
          {busy === "burn" ? "Burning…" : "Burn NFT"}
        </button>
      </div>
      {!blocker && liquidity > 0n && amountError && <div style={{ ...errorText, marginTop: 4 }}>{amountError}</div>}
      {message && (
        <div data-testid="tx-message" style={{ marginTop: 8, color: message.kind === "ok" ? "#81c995" : "#f28b82" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function describeCollect(logs: Parameters<typeof parseEventLogs>[0]["logs"]): string {
  // collect()'s return values are not observable from a transaction; read the Collect event.
  const [event] = parseEventLogs({ abi: miniPositionNftAbi, eventName: "Collect", logs });
  return event ? `collected ${event.args.amount0} token0 / ${event.args.amount1} token1.` : "collected fees.";
}

function describeError(err: unknown): string {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) return "Transaction rejected in the wallet.";
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      const hint: Record<string, string> = {
        NotOwner: "only the position owner can do this",
        InsufficientLiquidity: "amount exceeds liquidity, or burn attempted with liquidity/fees left",
        PositionNotFound: "position does not exist",
      };
      return `Reverted: ${name ?? revert.reason ?? "unknown"}${name && hint[name] ? ` — ${hint[name]}` : ""}`;
    }
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : String(err);
}


const card = { marginBottom: 12, border: "1px solid #333", padding: 12, listStyle: "none" };
const muted = { fontSize: 12, opacity: 0.7 };
const errorText = { color: "#f28b82", fontSize: 13 };
const grid = { display: "grid", gridTemplateColumns: "160px 1fr", gap: "4px 12px", margin: "12px 0 0", fontSize: 14 };
const badge = { padding: "1px 8px", borderRadius: 10, fontSize: 12 };
