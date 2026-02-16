# Task: gen-comb-subsets-3678 | Score: 100% | 2026-02-11T09:15:14.044073

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  subsets = []
  for i in range(1 << n):
    subset = []
    for j in range(n):
      if (i >> j) & 1:
        subset.append(nums[j])
    subsets.append(subset)

  subsets.sort(key=lambda x: (len(x), x))

  for subset in subsets:
    print(" ".join(map(str, subset)))

solve()