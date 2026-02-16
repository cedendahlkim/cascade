# Task: gen-list-count_positive-5009 | Score: 100% | 2026-02-13T18:58:01.177039

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))