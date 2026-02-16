# Task: gen-comb-subsets-3844 | Score: 100% | 2026-02-10T18:14:49.877888

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def subsets(arr):
        result = [[]]
        for i in range(1, 1 << len(arr)):
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