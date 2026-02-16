# Task: gen-comb-subsets-8767 | Score: 100% | 2026-02-11T10:00:53.278956

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]
    
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(str(nums[j]))
        print(" ".join(subset))

solve()