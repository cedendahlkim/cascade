# Task: gen-ll-reverse_list-3643 | Score: 100% | 2026-02-13T19:06:02.433330

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))