# Task: gen-comb-subsets-9776 | Score: 100% | 2026-02-11T10:25:51.492093

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
                subset.append(str(nums[j]))
        subsets.append(" ".join(subset))

    for subset in subsets:
        print(subset)

solve()