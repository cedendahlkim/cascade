# Task: gen-ll-reverse_list-8716 | Score: 100% | 2026-02-13T21:08:10.629908

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))