// AutoLab v1.1 task domains at commit 7aff5fe71dfbe152fb0b8e8ac8087210b4bc27d5.
// Source: https://github.com/autolabhq/autolab#task-list
export const AUTOLAB_TASK_CATEGORY = Object.freeze({
  // Model Development (7)
  data_select_ifeval: "model_dev",
  flux2_klein_lora: "model_dev",
  grpo_multisource: "model_dev",
  llm_online_serving: "model_dev",
  moving_mnist_world_model: "model_dev",
  multilingual_ocr: "model_dev",
  scaling_law: "model_dev",

  // System Optimization (15)
  aes128_ctr: "system_opt",
  agent_tool_routing: "system_opt",
  bm25_search_go: "system_opt",
  bvh_raytracer: "system_opt",
  concurrent_kv_wal: "system_opt",
  fft_rust: "system_opt",
  flash_attention: "system_opt",
  gaussian_blur: "system_opt",
  hash_join: "system_opt",
  levenshtein_distance: "system_opt",
  radix_sort: "system_opt",
  regex_engine: "system_opt",
  sha256_throughput: "system_opt",
  sstable_compaction_rs: "system_opt",
  z_order_range_scan: "system_opt",

  // Puzzle & Challenge (10)
  adaptive_compression: "puzzle",
  adversarial_splay: "puzzle",
  discover_sorting: "puzzle",
  fredkin_sort_network: "puzzle",
  resnet_bit_flip: "puzzle",
  safety_router: "puzzle",
  smallest_game_player: "puzzle",
  stack_machine_golf: "puzzle",
  toy_isa_opt: "puzzle",
  vliw_scheduler: "puzzle",

  // CUDA (4)
  huffman_canonical_decode_cuda: "cuda",
  icp_correspondence_step_cuda: "cuda",
  msm_pippenger_bls12_381_cuda: "cuda",
  ntt_butterfly_cuda: "cuda",
});
