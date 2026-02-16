# Task: gen-comb-subsets-8115 | Score: 100% | 2026-02-11T07:34:34.063376

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())
    
    result = []
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(nums[j])
        result.append(subset)

    result.sort(key=lambda x: (len(x), x))

    for subset in result:
        print(*subset)

solve()