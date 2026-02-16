# Task: gen-comb-combinations-3989 | Score: 100% | 2026-02-11T09:20:27.015875

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        def backtrack(combination, start):
            if len(combination) == k:
                result.append(combination[:])
                return
            for i in range(start, len(arr)):
                combination.append(arr[i])
                backtrack(combination, i + 1)
                combination.pop()
        backtrack([], 0)
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()