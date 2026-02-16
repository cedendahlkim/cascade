# Task: gen-ds-min_stack-3922 | Score: 100% | 2026-02-12T14:33:57.364939

class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, x):
        self.stack.append(x)
        if not self.min_stack or x <= self.min_stack[-1]:
            self.min_stack.append(x)

    def pop(self):
        if self.stack:
            popped = self.stack.pop()
            if popped == self.min_stack[-1]:
                self.min_stack.pop()

    def getMin(self):
        if self.min_stack:
            return self.min_stack[-1]
        return None

n = int(input())
stack = MinStack()

for _ in range(n):
    line = input().split()
    op = line[0]

    if op == "push":
        x = int(line[1])
        stack.push(x)
    elif op == "pop":
        stack.pop()
    elif op == "min":
        print(stack.getMin())