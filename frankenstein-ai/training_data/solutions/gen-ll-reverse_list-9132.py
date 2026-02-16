# Task: gen-ll-reverse_list-9132 | Score: 100% | 2026-02-13T18:45:54.356088

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))