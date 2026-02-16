# Task: gen-comb-subsets-5863 | Score: 100% | 2026-02-10T17:44:04.660692

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

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