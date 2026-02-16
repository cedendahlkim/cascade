# Task: gen-list-average-8351 | Score: 100% | 2026-02-13T09:34:12.530467

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))