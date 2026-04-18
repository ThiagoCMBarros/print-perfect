import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conta/pedidos/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/pedido/$id", params: { id: params.id } });
  },
});
