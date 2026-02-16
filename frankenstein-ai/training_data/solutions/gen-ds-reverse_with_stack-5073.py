# Task: gen-ds-reverse_with_stack-5073 | Score: 100% | 2026-02-14T12:20:39.999909

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))