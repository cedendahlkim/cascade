# Task: gen-list-average-5634 | Score: 100% | 2026-02-14T12:08:58.933290

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))