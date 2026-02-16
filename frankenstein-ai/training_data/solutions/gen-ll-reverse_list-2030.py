# Task: gen-ll-reverse_list-2030 | Score: 100% | 2026-02-13T21:28:04.579228

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))