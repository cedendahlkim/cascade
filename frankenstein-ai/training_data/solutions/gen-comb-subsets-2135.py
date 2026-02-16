# Task: gen-comb-subsets-2135 | Score: 100% | 2026-02-11T11:46:10.130504

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

    print("")
    for i in range(1, 1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(str(nums[j]))
        print(" ".join(subset))


solve()