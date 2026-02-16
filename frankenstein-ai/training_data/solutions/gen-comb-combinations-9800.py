# Task: gen-comb-combinations-9800 | Score: 100% | 2026-02-11T10:39:40.049554

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

        without_first = combinations(rest, k)
        with_first = combinations(rest, k - 1)
        
        for comb in with_first:
            result.append([first] + comb)
        
        result.extend(without_first)
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()