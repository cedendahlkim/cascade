# Task: gen-comb-subsets-9979 | Score: 100% | 2026-02-11T09:21:51.084432

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(nums):
        result = []
        for i in range(1 << len(nums)):
            subset = []
            for j in range(len(nums)):
                if (i >> j) & 1:
                    subset.append(nums[j])
            result.append(subset)
        return result

    subsets = powerset(nums)
    
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()