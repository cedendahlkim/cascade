# Task: gen-ll-reverse_list-5568 | Score: 100% | 2026-02-15T07:48:37.404797

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))