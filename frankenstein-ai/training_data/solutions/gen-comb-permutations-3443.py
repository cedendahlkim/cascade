# Task: gen-comb-permutations-3443 | Score: 100% | 2026-02-10T18:59:30.472111

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

for perm in permutations(nums):
    print(*perm)