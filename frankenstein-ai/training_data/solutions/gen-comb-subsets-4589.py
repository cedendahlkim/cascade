# Task: gen-comb-subsets-4589 | Score: 100% | 2026-02-10T18:06:12.197008

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(arr):
        result = []
        for i in range(1 << len(arr)):
            subset = []
            for j in range(len(arr)):
                if (i >> j) & 1:
                    subset.append(arr[j])
            result.append(subset)
        return result

    subsets = powerset(nums)
    subsets.sort(key=len)

    for subset in subsets:
        print(*subset)

solve()