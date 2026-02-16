# Task: gen-ll-reverse_list-5155 | Score: 100% | 2026-02-13T13:47:36.707806

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))