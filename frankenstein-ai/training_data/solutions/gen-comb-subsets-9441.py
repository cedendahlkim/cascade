# Task: gen-comb-subsets-9441 | Score: 100% | 2026-02-10T17:59:02.451880

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

    for subset in sorted(subsets, key=lambda x: (len(x.split()), x)):
        print(subset)

solve()