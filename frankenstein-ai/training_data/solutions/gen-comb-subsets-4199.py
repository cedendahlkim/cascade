# Task: gen-comb-subsets-4199 | Score: 100% | 2026-02-11T11:19:26.645532

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
        subsets.append(subset)
    
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(" ".join(subset))

solve()