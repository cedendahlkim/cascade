# Task: gen-comb-combinations-1486 | Score: 100% | 2026-02-11T07:29:22.399401

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

        comb_with_first = combinations(rest, k - 1)
        for comb in comb_with_first:
            result.append([first] + comb)

        comb_without_first = combinations(rest, k)
        result.extend(comb_without_first)

        return result

    combs = combinations(nums, k)
    combs.sort()
    for comb in combs:
        print(*comb)

solve()