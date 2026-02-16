# Task: gen-list-count_positive-7378 | Score: 100% | 2026-02-13T18:39:58.226757

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))