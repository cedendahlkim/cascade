# Task: gen-comb-subsets-1222 | Score: 100% | 2026-02-11T11:25:58.039190

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

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
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()