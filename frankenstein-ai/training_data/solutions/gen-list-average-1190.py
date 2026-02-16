# Task: gen-list-average-1190 | Score: 100% | 2026-02-13T16:07:08.787743

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))