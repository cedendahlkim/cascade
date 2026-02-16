# Task: gen-ll-reverse_list-6385 | Score: 100% | 2026-02-15T09:17:51.289045

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))