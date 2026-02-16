# Task: gen-ds-reverse_with_stack-4072 | Score: 100% | 2026-02-13T14:18:20.976710

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))