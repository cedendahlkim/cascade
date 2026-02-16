# Task: gen-ds-reverse_with_stack-8871 | Score: 100% | 2026-02-13T13:53:48.253773

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))