# Task: gen-ll-reverse_list-4767 | Score: 100% | 2026-02-13T13:53:38.321171

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))