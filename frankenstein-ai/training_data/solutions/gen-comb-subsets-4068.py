# Task: gen-comb-subsets-4068 | Score: 100% | 2026-02-11T08:50:43.785634

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

    def subsets(arr):
        result = []
        for i in range(1 << len(arr)):
            subset = []
            for j in range(len(arr)):
                if (i >> j) & 1:
                    subset.append(arr[j])
            result.append(subset)
        return result

    all_subsets = subsets(nums)
    all_subsets.sort(key=lambda x: (len(x), x))

    for subset in all_subsets:
        print(*subset)

solve()