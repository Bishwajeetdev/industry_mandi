import { useEffect, useState } from "react";
import { api } from "../api/api";

function useProducts(query = "") {
  const [state, setState] = useState({ loading: true, items: [], error: "" });
  const load = (searchTerm = query) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get("/products", { params: { q: searchTerm.trim() } })
      .then((r) =>
        setState({ loading: false, items: Array.isArray(r.data?.data?.items) ? r.data.data.items : [], error: "" }),
      )
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(() => {
    load();
  }, []);
  return { ...state, load };
}


export default useProducts;
