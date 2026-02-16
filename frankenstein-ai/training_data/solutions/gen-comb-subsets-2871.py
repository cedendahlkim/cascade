# Task: gen-comb-subsets-2871 | Score: 100% | 2026-02-11T11:12:51.200708

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

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
    subsets.sort(key=lambda x: (len(x), tuple(x)))

    for subset in subsets:
        print(*subset)

solve()