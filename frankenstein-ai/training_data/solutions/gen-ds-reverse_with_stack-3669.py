# Task: gen-ds-reverse_with_stack-3669 | Score: 100% | 2026-02-13T13:47:05.027614

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))