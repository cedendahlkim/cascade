# Task: gen-comb-combinations-3647 | Score: 100% | 2026-02-11T09:19:07.127538

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

        first = arr[0]
        rest = arr[1:]

        without_first = combinations(rest, k)
        with_first = combinations(rest, k - 1)
        for comb in with_first:
            comb.insert(0, first)
        
        return with_first + without_first

    combs = combinations(nums, k)
    
    for comb in combs:
        print(*comb)

solve()