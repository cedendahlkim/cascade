# Task: gen-comb-permutations-2817 | Score: 100% | 2026-02-11T07:29:18.983481

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def permutations(arr):
        if len(arr) == 0:
            return [[]]

        result = []
        for i in range(len(arr)):
            first = arr[i]
            rest = arr[:i] + arr[i+1:]
            for p in permutations(rest):
                result.append([first] + p)
        return result

    perms = sorted(permutations(nums))
    for perm in perms:
        print(*perm)

solve()