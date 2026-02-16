# Task: gen-comb-subsets-1642 | Score: 100% | 2026-02-11T08:49:07.592156

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

    subsets.sort(key=lambda x: (len(x), ' '.join(x)))

    for subset in subsets:
        print(' '.join(subset))

solve()