# Task: gen-comb-subsets-9257 | Score: 100% | 2026-02-10T18:10:20.931318

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

    def powerset(nums):
        result = []
        for i in range(1 << len(nums)):
            subset = []
            for j in range(len(nums)):
                if (i >> j) & 1:
                    subset.append(str(nums[j]))
            result.append(" ".join(subset))
        return result

    result = powerset(nums)
    result.sort(key=lambda x: (len(x.split()), x))
    for subset in result:
        print(subset)

solve()