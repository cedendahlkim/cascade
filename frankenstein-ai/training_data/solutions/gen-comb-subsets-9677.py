# Task: gen-comb-subsets-9677 | Score: 100% | 2026-02-10T18:41:18.287138

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

    for subset in sorted(subsets, key=lambda x: (len(x), x)):
        print(*subset)

solve()