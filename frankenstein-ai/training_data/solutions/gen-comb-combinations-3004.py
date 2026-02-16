# Task: gen-comb-combinations-3004 | Score: 100% | 2026-02-11T10:30:02.183489

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
        
        without_first = combinations(rest, k)
        with_first = [[first] + comb for comb in combinations(rest, k-1)]
        
        result = with_first + without_first
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()