# Task: gen-comb-combinations-5824 | Score: 100% | 2026-02-11T09:49:05.253532

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        if k == 0:
            return [[]]
        if not arr:
            return []

        first = arr[0]
        rest = arr[1:]

        with_first = [[first] + comb for comb in combinations(rest, k - 1)]
        without_first = combinations(rest, k)

        result = with_first + without_first
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()