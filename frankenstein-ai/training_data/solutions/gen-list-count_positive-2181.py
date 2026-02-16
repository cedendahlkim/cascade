# Task: gen-list-count_positive-2181 | Score: 100% | 2026-02-13T11:27:23.685105

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))