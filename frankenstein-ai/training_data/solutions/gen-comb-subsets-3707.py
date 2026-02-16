# Task: gen-comb-subsets-3707 | Score: 100% | 2026-02-11T10:58:26.398347

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

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