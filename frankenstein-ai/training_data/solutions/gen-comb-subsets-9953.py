# Task: gen-comb-subsets-9953 | Score: 100% | 2026-02-11T11:13:18.273214

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    subsets = []
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(nums[j])
        subsets.append(subset)

    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()