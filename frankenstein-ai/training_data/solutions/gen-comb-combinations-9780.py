# Task: gen-comb-combinations-9780 | Score: 100% | 2026-02-10T18:06:36.669613

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        if k == 0:
            return [[]]
        if not arr:
            return []

        result = []
        first = arr[0]
        rest = arr[1:]

        with_first = combinations(rest, k - 1)
        for comb in with_first:
            result.append([first] + comb)

        without_first = combinations(rest, k)
        for comb in without_first:
            result.append(comb)
            
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()