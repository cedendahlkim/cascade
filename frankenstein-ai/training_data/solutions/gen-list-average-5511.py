# Task: gen-list-average-5511 | Score: 100% | 2026-02-13T15:28:42.810853

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))