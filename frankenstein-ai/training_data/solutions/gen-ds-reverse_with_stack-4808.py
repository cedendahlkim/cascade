# Task: gen-ds-reverse_with_stack-4808 | Score: 100% | 2026-02-13T19:14:54.392954

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))